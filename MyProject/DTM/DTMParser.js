var row;//DTM描述（以行为单位记录）
var curdes;//当前函数的源
var curmov;//当前函数移动目标
var curscr;//当前函数描述

var tape;//带集合
//tape下的内容
//var tcontent//记录带上内容
//var tshow;//带内容显示的位置
//var maxend;//带上最右边位置
//var maxstart;//带上最左边位置
var register;//寄存器集合
var alphabet;//字母表集合
var func;//转移函数集合
//func下内容
var descartesset;//笛卡尔积
var map;//函数映射

var tshowstart;//记录从第几条带开始显示
var tshowcelllength;//记录带单元显示的宽度
var tregisterlength;//记录寄存器显示的宽度
var head;//记录当前磁头位置
var movcount;//移动步数
var maxmem;//单带使用过的最大内存空间 = +所有(maxend - maxstart)
var inputmen;//输入空间
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMCompile
//参数：DTM的代码行
//返回值：编译错误提示
//调用模块：getErrPos, replaceAll, getCurrentFunc, DTMMatchFunc
//全局变量：tape, register, alphabet, func, descartesset, map, head, tshowstart, movcount, maxmem, inputmen,
//          row, curdes, curmov, curscr
//功能：编译DTM的代码，并返回编译信息
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMParser(dtm)
{
    var result="";
    row=dtm.split("\n");
    tape={};
    register={};
    alphabet={};
    func={};
    descartesset={};
    map={}
    var realrow=0;//程序解析当前行数
    var rindex;
    var isEmpty=0;
    var errpos = new Object();
    //errpos.erow=0;//错误所在行
    //errpos.ecol=0;//错误所在列
    //errpos.ep=0;//错误查找的列开始位置
    var num = 0;
    for(rindex=0;rindex<row.length;rindex++){  
        var r;
        var rowc=1;
        errpos.erow=rindex;
        errpos.ecol=0;
        errpos.ep=0;
        r=row[rindex].replace(/(\s{2,})/g, " ");//消除连续的空格
        r=r.replace(/(^\s*)|(\s*$)/g, "");//消除前后的空格
        if(r.length >= 3){
		        while(r.lastIndexOf(" ~~") == r.length - 3){//本行没有结束，接下一行 
		        		rindex++;
		        		if(rindex == row.length){
		        				rindex--;
		        				break;	
		        		}
		        		rowc++; 
		        		var r1=row[rindex].replace(/(\s{2,})/g, " ");//消除连续的空格
		        		r1=r1.replace(/(^\s*)|(\s*$)/g, "");//消除前后的空格
		        		if(r1.length ==0)continue;
		        		r = r.substring(0, r.length -2);
		        		r=r+r1;
		        }
		        if(r.lastIndexOf(" ~~") == r.length - 3){
		        		r = r.substring(0, r.length -2);
		        }
	      }
	      
        if(r.length!=0){//本行有内容
            isEmpty=1;
            if(r.indexOf("//")==0)continue;
            var srow;//以空格为基准分割后的字符串
            if(realrow==0){//带描述
                srow=r.split(" "); 
                for(var i=0;i<srow.length;i++){
                		getErrPos(rindex,row,srow[i],errpos);
                    if(tape[srow[i]]==null){
                        tape[srow[i]]=srow[i];
                    }else{                  		
                        result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，带(tape)名称有重名！\n";                     
                    }
                }                     
            }else if(realrow==1){//寄存器描述
                srow=r.split(" ");
                for(var i=0;i<srow.length;i++){
                		getErrPos(rindex,row,srow[i],errpos);
                    if(register[srow[i]]==null){
                        if(srow[i].indexOf("~")!=-1 || srow[i].indexOf("`")!=-1){
                            result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，字符表(register)名称含有 ~ ` 等特殊符号！\n";
                        }else{
                            register[srow[i]]=srow[i];
                        }
                    }else{
                        result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，寄存器状态(register)名称有重名！\n";                   
                    }
                }  
                if (register["start"]==null){
                    result += "警告：行 " + (rindex - rowc  + 2) + " 列 1" + " ，寄存器状态(register)集合没有包含开始(start)状态！\n";
                }  
                if (register["halt"]==null){
                    result += "警告：行 " + (rindex - rowc + 2) + " 列 1" + " ，寄存器状态(register)集合没有包含停机(halt)状态！\n"; 
                }
            }else if(realrow==2){//字符表描述
                srow=r.split(" ");
                for(var i=0;i<srow.length;i++){
                		getErrPos(rindex,row,srow[i],errpos);
                    if(alphabet[srow[i]]==null){
                        if(srow[i].indexOf("~")!=-1 || srow[i].indexOf("`")!=-1){
                            result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，字符表(alphabet)名称含有 ~ ` 等特殊符号！\n";
                        }else{
                            alphabet[srow[i]]=srow[i];
                        }
                    }else{
                        result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，字符表(alphabet)名称有重名！\n";                     
                    }
                }  
                if (alphabet["#"]==null)
                {
                    result += "警告：行 " + (rindex - rowc  + 2) + " 列 1" + " ，字符表(alphabet)集合没有包含空白符(#)！\n";
                }  
            }else if(realrow==3){//笛卡尔积描述
                srow=r.split(" ");
                if(r.indexOf("~")==0){
                		getErrPos(rindex,row,srow[0],errpos);
                		var erow0 = errpos.erow;
                		var ecol0 = errpos.ecol;
                		if(srow[0].length<2){		
                				result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，没有设置笛卡尔集名称！\n";
                		}else{
                				if(srow[0].replace("~","").indexOf("~")!=-1 || srow[0].replace("~","").indexOf("`")!=-1){
		                        result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，笛卡尔集名称含有 ~ ` 等特殊符号！\n";
		                    }else{
		                				if(descartesset[srow[0]]==null){
		                						if(srow.length>1){              								
				                						var ad={};
							                			for(var i=1;i<srow.length;i++){
							                					getErrPos(rindex,row,srow[i],errpos);
							                					if(ad[srow[i]]==null){
							                							if(srow[i].indexOf("~")!=-1 || srow[i].indexOf("`")!=-1){
										                            result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，笛卡尔集元素名称含有 ~ ` 等特殊符号！\n";
										                        }else{
										                            ad[srow[i]]=srow[i];
										                        }
							                					}else{
							                							result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，笛卡尔集内有相同元素！\n"; 
							                					}
							                			}
							                			if(Object.keys(ad).length==0){
							                					result += "错误：行 " + (erow0 + 1) + " 列 " + (ecol0 + 1) + " ，笛卡尔集不能为空！\n"; 
							                			}else{
					                							descartesset[srow[0]]=ad;
					                					}
					                			}else{
					                					result += "错误：行 " + (erow0 + 1) + " 列 " + (ecol0 + 1) + " ，笛卡尔集不能为空！\n"; 
					                			}
			                			}else{
			                					result += "错误：行 " + (erow0 + 1) + " 列 " + (ecol0 + 1) + " ，笛卡尔集同名！\n"; 
			                			}
	                			}
                		}
                    continue;
                }else{
                    rindex-=rowc;
                }
            }else if(realrow==4){//函数映射描述
                srow=r.split(" ");
                if(r.indexOf("`")==0){
                		getErrPos(rindex,row,srow[0],errpos);
                		var erow0 = errpos.erow;
                		var ecol0 = errpos.ecol;
                		if(srow[0].length<2){
                				result += "错误：行 " + (erow0 + 1) + " 列 " + (ecol0 + 1) + " ，没有设置单映射集名称！\n";
                		}else{
                				if(srow[0].replace("`","").indexOf("~")!=-1 || srow[0].replace("`","").indexOf("`")!=-1){
		                        result += "错误：行 " + (erow0 + 1) + " 列 " + (ecol0 + 1) + " ，单映射集名称含有 ~ ` 等特殊符号！\n";
		                    }else{
		                				if(map[srow[0]]==null){
		                						if(srow.length>1){
		                								getErrPos(rindex,row,srow[1],errpos);
								                		var erow1 = errpos.erow;
								                		var ecol1 = errpos.ecol;
				                						if(descartesset[srow[1]]!=null){
				                								if(srow.length-2 == Object.keys(descartesset[srow[1]]).length){
				                										var ar=new Array();
											                			for(var i=2;i<srow.length;i++){
											                					getErrPos(rindex,row,srow[i],errpos);
											                					if(srow[i].indexOf("~")!=-1 || srow[i].indexOf("`")!=-1){
												                            result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，单映射集元素名称含有 ~ ` 等特殊符号！\n";
												                        }else{
												                            ar.push(srow[i]);
												                        }
											                			}
											                			if(srow.length-2==Object.keys(ar).length){
											                					var mo = new Object();
													                			mo.des = srow[1];
													                			mo.map = ar;
													                			map[srow[0]] = mo;
											                			}else{
											                					result += "错误：行 " + (erow1 + 1) + " 列 " + (ecol1 + 1) + " ，单映射集定义域与值域数目不一致！\n"; 
											                			}
									                			}else{
									                					result += "错误：行 " + (erow1 + 1) + " 列 " + (ecol1+ 1) + " ，单映射集定义域与值域数目不一致！\n"; 
									                			}
							                			}else{
							                					result += "错误：行 " + (erow1 + 1) + " 列 " + (ecol1 + 1) + " ，单映射集定义域没有定义！\n"; 
							                			}
						                		}else{
						                				result += "错误：行 " + (erow0 + 1) + " 列 " + (ecol0 + 1) + " ，单映射集缺少定义域和值域！\n"; 
						                		}
			                			}else{
			                					result += "错误：行 " + (erow0 + 1) + " 列 " + (ecol0 + 1) + " ，单映射集同名！\n"; 
			                			}
	                			}
                		}
                    continue;
                }else{
                    rindex-=rowc;
                }
            }else{//转移函数描述
                if(r.indexOf("#")==0){
                    r=r.replace("#"," ");//将第一个#号替换为空格
                    r=r.replace(/(^\s*)|(\s*$)/g, "");//消除前后的空格
                    srow=r.split(" ");
                    var erow = errpos.erow;
        						var ecol = errpos.ecol;
        						var ep = errpos.ep;
                    var n=Object.keys(tape).length;                 
                    if(srow.length<n*3+2){
                        result += "错误：行 " + (rindex - rowc  + 2) + " 列 1" + " ，转移函数(function)参数过少！\n";
                    }else if(srow.length>n*3+2){
                        result += "错误：行 " + (rindex - rowc  + 2) + " 列 1" + " ，转移函数(function)参数过多！\n";
                    }else{
                    		var d={};
                    		for(var i=0;i<srow.length;i++){
		                    		var darr=srow[i].split("~");            
		                    		if(darr.length%2==0){
		                    				continue;
		                    		}
		                    		var k;		                    		                		
		                    		for(k=1;k<darr.length;k=k+2){
		                    				if(descartesset["~"+darr[k]]!=null){
		                    						d["~"+darr[k]]=Object.keys(descartesset["~"+darr[k]]);
		                    				}
		                    		}
                    		}
                    		var berr=0;
                    		var m={};
                    		var desp=0;
                    		var fstr="";
                    		for(var i=0;i<srow.length;i++){
                    				var d1={};
                    				var m1={};
		                    		var darr=srow[i].split("~");
		                    		var marr=srow[i].split("`");
		                    		var berr1=0;
		             						getErrPos(rindex,row,srow[i],errpos);
		                    		if(darr.length%2==0){
		                    				result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，笛卡尔集(~)匹配不正确！\r\n"; 
		                    				continue;
		                    		}
		                    		if(marr.length%2==0){
		                    				result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，单映射集(`)匹配不正确！\r\n"; 
		                    				continue;
		                    		}
		                    		if(i < n + 1){
		                    				desp = desp + srow[i].length + 1;
		                    				fstr += srow[i] + " ";
		                    		}
		                    		var k,l;
		                    		var edp;
		                    		edp=0;              		
		                    		for(k=1;k<darr.length;k=k+2){
		                    				edp=srow[i].indexOf(darr[k-1],edp);
		                    				edp=edp+darr[k-1].length;
		                    				edp=srow[i].indexOf(darr[k],edp);
		                    				if(descartesset["~"+darr[k]]==null){
		                    						result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + edp) + " ，笛卡尔集不存在！\r\n"; 
		                    						berr=1;
		                    						berr1=1;
		                    				}else{
		                    						d1["~"+darr[k]]=d["~"+darr[k]];
		                    				}
		                    				if(i > n){
		                    						if(r.indexOf("~"+darr[k]+"~") >= desp){//限制本语句内部转移冲突
		                    								result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + edp) + " ，笛卡尔集不能单独出现转移内容！\r\n"; 
		                    								berr=1;
		                    								berr1=1;
		                    						}
		                    				}
		                    				edp=edp+darr[k].length;	
		                    		}
		                    		var emp=0;
		                    		for(l=1;l<marr.length;l=l+2){
		                    				emp=srow[i].indexOf(marr[l-1],emp);
		                    				emp=emp+marr[l-1].length;
		                    				emp=srow[i].indexOf(marr[l],emp);
		                    				if(map["`"+marr[l]]==null){
		                    						result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + emp) + " ，单映射集不存在！\r\n"; 
		                    						berr=1;
		                    						berr1=1;
		                    				}else{
		                    						if(d[map["`"+marr[l]].des]==null){
		                    								result += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + emp) + " ，单映射集的定义域没有在转移函数！\r\n"; 
		                    								berr=1;
		                    								berr1=1;
		                    						}else{
		                    								m1["`"+marr[l]]=map["`"+marr[l]];
		                    								d1[map["`"+marr[l]].des]=d[map["`"+marr[l]].des];
		                    								if(i < n + 1){
		                    										m["`"+marr[l]]=map["`"+marr[l]];
		                    								}
		                    						}
		                    				}
		                    				emp=emp+marr[l].length;
		                    		}
		                    		
		                    		if(berr1==0){
		                    				var da1=Object.keys(d1);
		                    				var ma1=Object.keys(m1);
				                    		var dc1=new Array();
				                				for(var l=0;l<da1.length;l++){
				                						dc1.push(d1[da1[l]].length);
				                				}
				                				
				                				traverseDescartesSet(dc1,parseWord);
		                    				function parseWord(c){
		                    						var str=srow[i];
		                    						for(var l=0;l<c.length;l++){
		                    								str=replaceAll(str,da1[l]+"~",d1[da1[l]][c[l]]);
		                    								for(var k=0;k<ma1.length;k++){																
		                    										if(da1[l]==m1[ma1[k]].des){                 												
		                    												str=replaceAll(str,ma1[k]+"`",m1[ma1[k]].map[c[l]]);
		                    										}
		                    								}	
		                    						}
		                    						var strerr="";
		                    						if(i==0){
				                    						if(str=="halt"){
				                    								strerr += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，原寄存器状态不能为停机状态halt！ (" + srow[i] + "  匹配  " + str +")\n"; 
				                    						}
				                    						if(register[str]==null){
				                    								strerr += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，原寄存器状态 " + str + " 不存在！ (" + srow[i] + "  匹配  " + str +")\n"; 
				                    						}
			                    					}else if(i<=n){
		                    								if(alphabet[str]==null){
				                    								strerr += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，字符 "  + str + " 不存在！ (" + srow[i] + "  匹配  " + str +")\n"; 
				                    						}
		                    						}else if(i==n+1){
				                    						if(register[str]==null){
				                    								strerr += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，转移寄存器状态 " + str + " 不存在！ (" + srow[i] + "  匹配  " + str +")\n"; 
				                    						}
				                    				}else if(i<=2*n+1){
		                    								if(alphabet[str]==null){
				                    								strerr += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，字符 " + str + " 不存在！ (" + srow[i] + "  匹配  " + str +")\n"; 
				                    						}
		                    						}else{
		                    								str=str.toUpperCase();
		                    								if(str!="L"&&str!="R"&&str!="S"){
		                    										strerr += "错误：行 " + (errpos.erow + 1) + " 列 " + (errpos.ecol + 1) + " ，磁头移动方向不正确！ (" + srow[i] + "  匹配  " + str +")\n"; 
		                    								}
		                    						}
		                    						if(strerr==""){
		                    								return 1;
		                    						}else{
			                    							result += strerr;
			                    							berr = 1;
				                    						return 0;
			                    					}
		                    				}
		                    		}
                    		}
                    		var da=Object.keys(d);
                    		var ma=Object.keys(m);
                				var dc=new Array();
                				var nn=1;
                				for(var l=0;l<da.length;l++){
                						dc.push(d[da[l]].length);
                						nn *= d[da[l]].length;
                				}
                				/*if(nn > 1000000){
                						result += "错误：行 " + (rindex - rowc  + 2) + " 列 1" + " ，单条语句匹配超出1000000条记录！\n";
                						return result;
                				}
                				if(num + nn > 3000000){
                						result += "错误：行 " + (rindex - rowc  + 2) + " 列 1" + " ，已经超出3000000条记录！\n";
                						return result;
                				}*/
                    		if(berr==0){//没有其他错误，匹配后检测
                    				fstr=fstr.substring(0,fstr.length-1);
                    				traverseDescartesSet(dc,parse);
                    				function parse(c){
                    						var str=fstr;
                    						for(var l=0;l<c.length;l++){
                    								str=replaceAll(str,da[l]+"~",d[da[l]][c[l]]);
                    								for(var k=0;k<ma.length;k++){																
                    										if(da[l]==m[ma[k]].des){                 												
                    												str=replaceAll(str,ma[k]+"`",m[ma[k]].map[c[l]]);
                    										}
                    								}	
                    						}
                								if(func[str]!=null){
                										result += "\n原  ：    "+ r + "   \n匹配：    " + str + "\n";
                										result += "错误：行 " + (rindex - rowc  + 2) + " 列 1" + " ， 与 " + func[str] + " 行转移函数原状态相同！！\n"; 
                										return 0;
                								}else{
                										num++;
                										func[str]=rindex - rowc  + 2;                										
                								}
                								return 1;
                    				}
                    		}
                    }                  
                }else{
                    result += "错误：行 " + (rindex - rowc  + 2) + " 列 1" + " ，缺少开始符号(#)！\n";
                }
            }
            realrow++;
        }
    }
    if(isEmpty==0){
        result += "警告：行 1 列 1 ，确定图灵机(DTM)为空！\n";
    }else{
        if(realrow<1){
            result += "警告：行 " + (rindex + 1) +  " 列 1 ，带(tape)集合为空！\n";
        }else if(realrow<2){
            result += "警告：行 " + (rindex + 1) + " 列 1" + " ，寄存器状态(register)集合为空！\n";
        }else if(realrow<3){
            result += "警告：行 " + (rindex + 1) + " 列 1" + " ，字符表(alphabet)集合为空！\n";
        }else if(realrow<5){
        		result += "警告：行 " + (rindex + 1) + " 列 1" + " ，转移函数(function)集合为空！\n";
        }
    }
    if(result==""){//编译成功
    		tshowstart = 0;
    		tshowcelllength = 50;
    		tregisterlength = 90;
    		movcount = 0;
    		inputmen = 0;
    		maxmem = 0;
    		head = new Array();  
		    head.push("start");
		    for (var key in tape){
		        var ar = new Object();
		        ar.tcontent={};
		        ar.tshow=-5;
		        ar.maxend=0;
		        ar.maxstart=0;
		        tape[key]=ar;
		        head.push(0);
		    }
		    curdes = getCurrentFunc();
		  	if(func[curdes] == null){//没找到相应转移函数
		  			curmov = "";
		  			curscr = "";
		  	}else{
			  		DTMMatchFunc(curdes, func[curdes]);
			  }
    }
    return result;
}
//查找错误所在位置
function getErrPos(rindex, row, srow, errpos)
{
	for(;errpos.erow<=rindex;errpos.erow++){
			errpos.ecol = row[errpos.erow].indexOf(srow,errpos.ep);
			if(errpos.ecol!=-1){//找到
					errpos.ep = errpos.ecol + srow.length;
					return;
			}else{//开始新一行查找
					errpos.ep=0;
			}
	}
}
//替换所有内容
function replaceAll(str,str1,str2)
{
		while(str.indexOf(str1)!=-1){
				str=str.replace(str1,str2);
		}
		return str;
}
//获取当前位置的转移函数的源
function getCurrentFunc()
{
		//读取磁头所在的内容
    var cs;
    cs = head[0];
    var tn = Object.keys(tape);
    for(var i=0; i < tn.length; i++){
    		if(tape[tn[i]].tcontent[head[i+1]]==null){
    				cs = cs + " #";
    		}else{
    				cs = cs + " " + tape[tn[i]].tcontent[head[i+1]];
    		}
  	}
  	return cs;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMMatchFunc
//参数：DTM的转移函数的源，所在图灵机描述的起始行
//返回值：无
//调用模块：replaceAll
//全局变量：tape, func, descartesset, map, row, curmov, curscr
//功能：根据转移函数的源，获取匹配转移函数的目标，函数描述
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMMatchFunc(strfc,rowindex)
{
    //获取原始转移函数描述
    var r;
    rowindex=rowindex-1;
		r=row[rowindex].replace(/(\s{2,})/g, " ");//消除连续的空格
    r=r.replace(/(^\s*)|(\s*$)/g, "");//消除前后的空格
    while(r.lastIndexOf(" ~~") == r.length - 3){//本行没有结束，接下一行 
    		rowindex++;
    		if(rowindex == row.length)break;	
    		var r1=row[rowindex].replace(/(\s{2,})/g, " ");//消除连续的空格
    		r1=r1.replace(/(^\s*)|(\s*$)/g, "");//消除前后的空格
    		if(r1.length ==0)continue;
    		r = r.substring(0, r.length -2);
    		r=r+r1;
    }
    if(r.lastIndexOf(" ~~") == r.length - 3){
    		r = r.substring(0, r.length -2);
    }
    r=r.substring(1,r.length);
    curscr=r;
    //获取匹配的目标转移函数
    var n=Object.keys(tape).length;
    var d={};
    var darr=r.split("~");  
    for(var k=1;k<darr.length;k=k+2){
    		d["~"+darr[k]]=Object.keys(descartesset["~"+darr[k]]);
    }
    var m={};
    
    var m1={};
    var srow=r.split(" ");
    var s1="";
    var s2="";
    for(var i=0;i<srow.length;i++){ 		
		    var marr=srow[i].split("`");
		    for(l=1;l<marr.length;l=l+2){
		    		m1["`"+marr[l]]=map["`"+marr[l]];
		    		if(i<n+1){
		    				m["`"+marr[l]]=map["`"+marr[l]];
		    		}
		    }
		    if(i<n+1){
		    		s1 += srow[i] + " ";
		    }else{
		    		s2 += srow[i] + " ";
		    }
    }
    s1=s1.substring(0,s1.length-1);
    s2=s2.substring(0,s2.length-1);  
    var da=Object.keys(d);
		var ma=Object.keys(m);
		var ma1=Object.keys(m1);
		var dc=new Array();
		for(var l=0;l<da.length;l++){
				dc.push(d[da[l]].length);
		}
		traverseDescartesSet(dc,match);
		function match(c){
				var str=s1;
				for(var l=0;l<c.length;l++){
						str=replaceAll(str,da[l]+"~",d[da[l]][c[l]]);
						for(var k=0;k<ma.length;k++){																
								if(da[l]==m[ma[k]].des){                 												
										str=replaceAll(str,ma[k]+"`",m[ma[k]].map[c[l]]);
								}
						}	
				}
				if(strfc==str){
						str=s2;
						for(var l=0;l<c.length;l++){
								str=replaceAll(str,da[l]+"~",d[da[l]][c[l]]);
								for(var k=0;k<ma1.length;k++){																
										if(da[l]==m1[ma1[k]].des){                 												
												str=replaceAll(str,ma1[k]+"`",m1[ma1[k]].map[c[l]]);
										}
								}	
						}
						curmov=str;
						return 0;
				}
				return 1;
		}
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMInit
//参数：无
//返回值：无
//调用模块：getCurrentFunc, DTMMatchFunc
//全局变量：tape, head, movcount, inputmem, maxmem, curdes, curmov, curscr
//功能：图灵机状态初始化
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMInit()
{
    //恢复原来的
    movcount = 0;   
    maxmem = 0;
    inputmen = 0;
    head[0] = "start";
    for (var key in tape)
    {
		    tape[key].tcontent={};	    
		    tape[key].tshow=-5;
		    tape[key].maxend=0;
		    tape[key].maxstart=0;
		    head[i] = 0;
    }
    curdes = getCurrentFunc();
  	if(func[curdes] == null){//没找到相应转移函数
  			curmov = "";
  			curscr = "";
  	}else{
	  		DTMMatchFunc(curdes, func[curdes]);
	  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMInput
//参数：图灵机输入
//返回值：无
//调用模块：getCurrentFunc, DTMMatchFunc
//全局变量：tape, head, movcount, inputmem, maxmem, input, curmov, curscr, curscr
//功能：图灵机输入
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMInput(input)
{
    //恢复原来的
    movcount = 0;   
    maxmem = 0;
    head[0] = "start";
    input = input.replace(/(\s{2,})/g, " ");//消除连续的空格
    input = input.replace(/(^\s*)|(\s*$)/g, "");//消除前后的空格
    var si = input.split(" ");
    inputmen = si.length;
    var i = 1;
    for (var key in tape)
    {
		    tape[key].tcontent={};	
		    if(i == 1){
		    		if(si.length == 1 && si[0]==""){//没有输入
		    		}else{
		    			var l = 0;
			    		for(var j=0; j<si.length; j++){
			    				if(si[j]!="#"){//还是空格不起作用
				    				tape[key].tcontent[l] = si[j];
				    				l++;
				    			}
			    		}
			    	}
		    }    
		    tape[key].tshow=-5;
		    tape[key].maxend=0;
		    tape[key].maxstart=0;
		    head[i] = 0;
		    i++;
    }
    curdes = getCurrentFunc();
  	if(func[curdes] == null){//没找到相应转移函数
  			curmov = "";
  			curscr = "";
  	}else{
	  		DTMMatchFunc(curdes, func[curdes]);
	  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMMove
//参数：无
//返回值：-1为没有找到对应转移函数，0为停机，1为正常
//调用模块：getCurrentFunc, DTMMatchFunc
//全局变量：tape, func, head, movcount, maxend, maxstart, maxmem, curdes, curmov, curscr
//功能：DTM移动
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMMove()
{
    if (head[0] == "halt"){//已经是停机状态
        return -1;
    }
    //读取磁头所在的内容
  	if(func[curdes] == null){//没找到相应转移函数
  			return 0;
  	}
  	var sf = curmov.split(" ");
  	head[0] = sf[0];
  	var n = head.length - 1;
  	var i = 1;
  	for(var key in tape){
  			//设置带内容
  			tape[key].tcontent[head[i]] = sf[i];
  			//设置带空间
  			if(sf[n + i] == "L"){
  					head[i] = head[i] - 1;
  					if(head[i] < tape[key].maxstart){
  							tape[key].maxstart = head[i];
  							maxmem++;			
  					}
  			}else if(sf[n + i] == "R"){
  					head[i] = head[i] + 1;
  					if(head[i] > tape[key].maxend){
  							tape[key].maxend = head[i];
  							maxmem++;
  					}
  			}else{
  			}
  			i++;
  	}
  	movcount++;
  	curdes = getCurrentFunc();
  	if(func[curdes] == null){//没找到相应转移函数
  			curmov = "";
  			curscr = "";
  	}else{
	  		DTMMatchFunc(curdes, func[curdes]);
	  }
  	return 1;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMShow
//参数：dtmrect绘图区域 canvas绘图画布 adjust是否自动调整带输出（1为调整，0为不调整）
//返回值：无
//调用模块：无
//全局变量：tape, register, alphabet, func, descartesset, map, head, tshowstart, movcount, maxmem, inputmen
//          curdes, curmov
//功能：绘制图灵机快照
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMShow(dtmrect, canvas, adjust)
{
    if (dtmrect.Height < 30 || dtmrect.Width < 30) return;
    var gi= canvas.getContext("2d");
		gi.clearRect(dtmrect.Left, dtmrect.Top, dtmrect.Width, dtmrect.Height);
		
    //状态字体
    var ft1 = "italic normal bold 25px sans-serif";//寄存器状态字体
    var ft2 = "8px arial";//运行状态信息
    var ft3 = "7px arial";//带单元格子号码、带名称字体
    var ft4 = "italic bold 13px arial";//最后一个格省略号字体
    var ft5 = "bold 18px arial";//带单元格字体

    //register长宽
    gi.font = ft1; 
    var regstr = head[0]; 				
		var l = gi.measureText(regstr).width;
		var n = l / regstr.length;//单个字符长度
		var m;
		if(tregisterlength > dtmrect.Width / 2 )tregisterlength = dtmrect.Width / 2;//寄存器单元过大
		if(tregisterlength < 90) tregisterlength = 90;//寄存器单元过小
		if(l > tregisterlength - 5){
				for(m=0; m < regstr.length; m++){
						if((m + 3) * n > tregisterlength - 5)break;
				}
				regstr = regstr.substring(0,m - 1) + "...";//超出格子显示范围使用省略号
		}else{           					
		}
		l =  gi.measureText(regstr).width;
    
    var w = tregisterlength;
    var h = 35;
 		var x = dtmrect.Left + dtmrect.Width / 2 - w;
 		var y = dtmrect.Top + 10;
 		var regrt = new Object();
 		regrt.Left = x;
 		regrt.Top = y;
 		regrt.Width = w;
 		regrt.Height = h
 		
 		//绘制register  
    gi.strokeStyle = "rgba(0,0,0,1)";
    gi.strokeRect(regrt.Left, regrt.Top, regrt.Width, regrt.Height);  
    gi.textBaseline = 'top';
    gi.textAlign = 'start';
    gi.fillText(regstr, x + (w -l)/2 - 2.5, y + 2.5);
    //显示图灵机运行信息
    gi.font = ft2; 
    gi.fillText("Step: " + movcount, x + w + 5, y - 4);
    gi.fillText("Memory: input " + inputmen + "  total " + maxmem, x + w + 5, y + 9);
    var tn = Object.keys(tape);
  	if(func[curdes] == null){
  			gi.fillText("Rull: ", x + w + 5, y + 20);
  	}else{
	  		gi.fillText("Rull: " + curdes + " " + curmov, x + w + 5, y + 22);
	  }

    //绘制tape
    //tape长宽
    if(tshowcelllength < 50)tshowcelllength = 50;//带单元格过小
    w = tshowcelllength; h = 35;
    var h1 = h + 42;
    var c1 = Math.floor((dtmrect.Width - 5) / w + 1);
    if(c1 <= 2){//带单元格长度过大	
    		c1 = 3;
    		tshowcelllength = Math.floor((dtmrect.Width - 5) / 3);
    }
    var c2 = Math.floor((dtmrect.Height - h1) / h1);  
    
    if (c2 > tn.length) c2 = tn.length;
		
    for (var j = tshowstart; j < tshowstart + c2 && j < tn.length; j++){
        //显示带名、空间使用情况
        var cs = "";
        cs += tn[j];
        cs += "  mem: left " + tape[tn[j]].maxstart;
        cs += " right " + tape[tn[j]].maxend;
        cs += " max " + (tape[tn[j]].maxend - tape[tn[j]].maxstart + 1);
        cs += " pos " + head[j + 1];
        gi.strokeStyle = "rgb(0,0,0)";
				gi.fillStyle = "rgb(0,0,0)";
        gi.font = ft3;
        gi.fillText(cs, dtmrect.Left + 5, dtmrect.Top + h1 * (j - tshowstart + 1) - 15);//显示带名称
        var count = head[j + 1];

        //带头显示调整
        var ts = tape[tn[j]].tshow;
        if (adjust){
            if (count < ts){
                ts = count - 4;
            }
            if (count > ts + c1 - 3){
                ts = count - c1 + 6;
            }
        }
        tape[tn[j]].tshow = ts;
				var x2 = x;
				var y2 = y;
        for (var i = -1; i < c1 - 1; i++){
            x2 = dtmrect.Left + i * w + 26; 
            y2 = dtmrect.Top + h1 * (j - tshowstart + 1);
            
            if (i + ts == count){//画磁头
            		var x1 = x2;
            		var y1 = y2;     		
    						gi.strokeStyle = "rgb(255,0,0)";
    						gi.fillStyle = "rgb(250,0,0)";
            		gi.strokeRect(x1 - 3, y1 -3, w + 6, h + 6);  
    						var wpos = x1 + w / 2 + (j - tshowstart) * 2 - 5;
                if (wpos > x1 + w) wpos = x1 + w;
             		gi.beginPath();
                gi.moveTo(wpos, y1);
                gi.lineTo(wpos, regrt.Top + regrt.Height + 10);
                gi.lineTo(regrt.Left + regrt.Width / 2, regrt.Top + regrt.Height + 10);
                gi.lineTo(regrt.Left + regrt.Width / 2, regrt.Top + regrt.Height);
                gi.stroke(); 
                gi.closePath();             
            }
            gi.strokeStyle = "rgb(0,0,0)";
				    gi.fillStyle = "rgb(0,0,0)";
				    if(i == -1){//带开始
				    		gi.beginPath();
				      	gi.moveTo(x2 + w, y2);
				      	gi.lineTo(x2 + w - 26, y2);
				      	gi.moveTo(x2 + w, y2 + h);
				      	gi.lineTo(x2 + w - 26, y2 + h); 
				        gi.stroke();    
				        gi.closePath();  
				        //单元格内容为“...” 
				        gi.font = ft4;
				        gi.fillText("...", x2 + w - 24, y2 + 10); 
				    }else if(i == c1 - 2){//带结束       	
            		gi.beginPath();
				      	gi.moveTo(x2 + w, y2);
				      	gi.lineTo(x2, y2);
				      	gi.lineTo(x2, y2 + h);
				      	gi.lineTo(x2 + w, y2 + h); 
				        gi.stroke();    
				        gi.closePath();  
				        //单元格内容为“...” 
				        gi.font = ft4;
				        gi.fillText("...", x2 + 15, y2 + 10);   	
            }else{	            
		    				gi.strokeRect(x2, y2, w, h); 
	    			} 	 
	    			if(i > -1){   			
		           	gi.font = ft3;
		        		gi.fillText((i + ts), x2 + 5, y2 + 38);//显示带格子号码
		        }

            if (i < c1 - 2 && i > -1){//显示带内容，第一个和最后一个单元格不显示
            		if(tape[tn[j]].tcontent[i + ts ]!=null && tape[tn[j]].tcontent[i + ts] != "#"){
            				gi.font = ft5;
            				var str = tape[tn[j]].tcontent[i + ts];   				
            				var l = gi.measureText(str).width;
            				var n = l / str.length;//单个字符长度
            				var m;
            				if(l > tshowcelllength - 5){
            						for(m=0; m < str.length; m++){
            								if((m + 3) * n > tshowcelllength - 5)break;
            						}
            						str = str.substring(0,m - 1) + "...";//超出格子显示范围使用省略号
            				}else{           					
            				}
            				l = gi.measureText(str).width;
            				gi.fillText(str, x2 + (w - l) / 2 - 2.5, y2 + 10);
            		}
            }
        }      
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMTanslate_SigleDirectionTapeDTM
//参数：无
//返回值：新的图灵机描述
//调用模块：DTMMatchFunc
//全局变量：tape, register, alphabet, func, descartesset, map, row, curmov, curscr
//功能：将图灵机转换为单边图灵机
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMTanslate_SigleDirectionTapeDTM()
{
		var dtm = "";
		for (var key in tape){
				if(key.indexOf("_") != -1){
						dtm += "//带名称中存在特殊符号 _ \n";
						break;
				}
		}
		for (var key in register){
				if(key.indexOf("_") != -1){
						dtm += "//寄存器名称中存在特殊符号 _ \n";
						break;
				}
		}
		for (var key in alphabet){
				if(key.indexOf("_") != -1){
						dtm += "//字符表名称中存在特殊符号 _ \n";
						break;
				}
		}
		if(dtm != "")return dtm;
		var s, s1, s2, s3, s4, s5;
		var strtape;	
		var strreg;
		var stralp;
		var strdes;
		var strmap;
		var strfunc;
		var tk = Object.keys(tape).length;//带长度	
		dtm += "//图灵机描述\n";
		dtm += "/////////带名//////////\n";
		dtm += "//原带名称：";
		var da = new Array();
		for (var key in tape){
				dtm += key + " ";
				da.push(2);
		}
		dtm += "\n";
		strtape = "";
		for (var key in tape){
				strtape += key + "   ";
		}
		strtape += "\n";
		dtm += strtape;
		
		dtm += "\n/////////寄存器//////////\n";
		dtm += "//原寄存器名称：";
		for (var key in register){
				dtm += key + " ";
		}
		dtm += "\n";
		strreg = "";
		traverseDescartesSet(da,reg)
		function reg(c)
		{
				s1 = "";
				for(var l=0;l<c.length;l++){
						if(c[l] == 0){
								s1 += "R";
						}else{
								s1 += "L";
						}	
				}
				s1 += "_";
				for (var key in register){
						if(key == "halt")continue;
						strreg += s1 + key + "   ";
				}
				strreg += " ~~\n";
		}
		strreg += "start   halt\n";
		dtm += strreg;
		
		dtm += "\n/////////字符表//////////\n";
		dtm += "//原字符表名称：";		
		stralp = "";
		s1 = "";
		for (var key in alphabet){
				s1 += key + " ";
				for (var key1 in alphabet){
						stralp += key + "_" + key1 + "   ";
				}
				stralp += " ~~\n";
		}
		stralp += "#   _\n";
		dtm += s1 + "\n";
		dtm += stralp;
		
		dtm += "\n/////////笛卡尔集//////////\n";	
		strdes = "";
		for(var i =0; i < tk; i++){
				strdes += "~_" + i + "_   ";
				for (var key in alphabet){
						strdes += key + "   ";	
				}
				strdes += "\n";
		}
		dtm += strdes;

		dtm += "\n/////////映射函数集//////////\n";
		strmap = "";
		dtm += strmap;
		
		
		dtm += "\n/////////转移函数//////////\n";
		strfunc = "";
		s1 = "";
		s2 = "";
		s3 = "";
		s4 = "";
		for(var i =0; i < tk; i++){
				s1 += "# ";
				s2 += "_ ";
				s3 += "R ";
				s4 += "R";
		}
		strfunc += "#start _ " + s1.substring(0, s1.length - 2) + " " + s4 + "_start " + s2 + " " + s3 + "\n\n";
		
		var dtmrow = dtm.split("\n").length;
		dtmrow += 1;
		var rfunc = {};
		for (var key in func){
				var arr0 = key.split(" ");
				DTMMatchFunc(key,func[key]);
				var arr1 = curmov.split(" ");
				for(var i = tk + 1; i < 2 * tk + 1; i++){
						arr1[i] = arr1[i].toUpperCase();
				}
				
				traverseDescartesSet(da,fc);
				function fc(c)
				{
						var dda = new Array();
						for(var l=1;l<arr0.length;l++){
								if(arr0[l]=="#"){
										dda.push(3);
								}else{
										dda.push(2);
								}
						}
						var bb = 0;
						traverseDescartesSet(dda,ffc);
						function ffc(cc){
								s1 = "";
								s2 = "";
								s3 = "";
								s4 = "";
								s5 = "";
								var sfc = "";
								for(var l=0;l<cc.length;l++){
										if(bb == 1){
												//cc[l]=0遇到字符
												//cc[l]=1遇到"_"符号寄存器状态对应改变
												//cc[l]=2遇到"#"符号改变为"#_#"
												if(cc[l] == 0){
														if(c[l] == 0){
																s1 += "R";
																s2 += arr0[l + 1] + "_" + "~_" + l + "_~ ";
																s3 += arr0[l + 1] + "_" + "~_" + l + "_~ ";		
																s4 += "S ";
																s5 += "R";													
														}else{
																s1 += "L";
																s2 += "~_" + l + "_~" + "_" + arr0[l + 1] + " ";
																s3 += "~_" + l + "_~" + "_" + arr0[l + 1] + " ";
																s4 += "S ";
																s5 += "L";		
														}
												}else if(cc[l] == 1){
														if(c[l] == 0){
																s1 += "R";
																s2 += "_ ";
																s3 += "_ ";		
																s4 += "R ";	
																s5 += "L";														
														}else{
																s1 += "L";
																s2 += "_ ";
																s3 += "_ ";	
																s4 += "R ";
																s5 += "R";	
														}
												}else{
														if(c[l] == 0){
																s1 += "R";
																s2 += "# ";
																s3 += "#_# ";		
																s4 += "S ";	
																s5 += "R";														
														}else{
																s1 += "L";
																s2 += "# ";
																s3 += "#_# ";	
																s4 += "S ";
																s5 += "L";	
														}
												}
										}else{
												if(c[l] == 0){
														s1 += "R";
														s2 += arr0[l + 1] + "_" + "~_" + l + "_~ ";
														s3 += arr1[l + 1] + "_" + "~_" + l + "_~ ";
														s4 += arr1[tk + 1 + l] + " ";
														s5 += "R";
												}else{
														s1 += "L";
														s2 += "~_" + l + "_~" + "_" + arr0[l + 1] + " ";
														s3 += "~_" + l + "_~" + "_" + arr1[l + 1] + " ";
														if(arr1[tk + 1 + l] == "R"){
																s4 += "L ";
														}else if(arr1[tk + 1 + l] == "L"){
																s4 += "R ";
														}else{
																s4 += "S ";
														}
														s5 += "L";
												}												
										}	
								}
								sfc += "#" + s1 + "_" + arr0[0] + " ";
								sfc += s2;
								var sfc1 = sfc;
								if(bb == 0){
										if(arr1[0] == "halt"){
												sfc += "halt ";
										}else{
												sfc += s5 + "_" + arr1[0] + " ";
										}
										bb = 1;
								}else{
										sfc += s5 + "_" + arr0[0] + " ";
								}
								sfc += s3;
								sfc += s4;
								
								if(rfunc[sfc1] == null){
										strfunc += sfc + "\n";
										rfunc[sfc1] = dtmrow;
										dtmrow++;
								}else{
										strfunc += "//eq." + rfunc[sfc1] + " " + sfc + "\n";
										dtmrow++;
								}
						}
				}
				strfunc += "\n";
				dtmrow++;
		}
		dtm += strfunc;
		
		return dtm;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMTanslate_01DTM
//参数：无
//返回值：新的图灵机描述
//调用模块：DTMMatchFunc
//全局变量：tape, register, alphabet, func, descartesset, map, row, curmov, curscr
//功能：将图灵机转换为01图灵机
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMTanslate_01DTM()
{
		var dtm = "";
		for (var key in tape){
				if(key.indexOf("_") != -1){
						dtm += "//带名称中存在特殊符号 _ \n";
						break;
				}
		}
		for (var key in register){
				if(key.indexOf("_") != -1){
						dtm += "//寄存器名称中存在特殊符号 _ \n";
						break;
				}
		}
		for (var key in alphabet){
				if(key.indexOf("_") != -1){
						dtm += "//字符表名称中存在特殊符号 _ \n";
						break;
				}
		}
		if(dtm != "")return dtm;
		var s, s0, s1, s2, s3, s4, s5, s6;
		var strtape;	
		var strreg;
		var stralp;
		var strdes
		var strmap;
		var strfunc;
		var tk = Object.keys(tape).length;//带长度	
		if(Object.keys(alphabet).length == 1){//字符表集合比01集合还少！
				for(var i = 0; i < row.length; i++){
						dtm += row[i] + "\n";
				}
				return dtm;
		}
		//对字符表进行编码
		var rc = Math.ceil(Math.log(Object.keys(alphabet).length)/Math.log(2));
		var alp = {};
		var ac = 1;
		var ala = new Array();
		ala.push("#");
		for (var key in alphabet){
				alp[key] = new Object();
				if(key != "#"){
						var c = ac;
						ala.push(key);
						ac++;				
						s1 = "";
						s2 = "";
						for(var k = 0; k < rc; k++){
								s1 = c%2 + " " + s1;
								s2 = s2 + " " + c%2;
								c=parseInt(c/2);
						}
				}else{
						s1 = "";
						s2 = "";
						for(var k = 0; k < rc; k++){
								s1 = "# " + s1;
								s2 = s2 + " #";
						}
				}
				s1 = s1.substring(0, s1.length - 1);
				s2 = s2.substring(1, s2.length);
				alp[key].read = s1;
				alp[key].write = s2;
		}		
			
		dtm += "//图灵机描述\n";
		dtm += "/////////带名//////////\n";
		dtm += "//原带名称：";
		for (var key in tape){
				dtm += key + " ";
		}
		dtm += "\n";
		strtape = "";		
		for (var key in tape){
				strtape += key + "   ";
		}
		dtm += strtape + "\n";
		
		dtm += "\n/////////寄存器//////////\n";
		dtm += "//原寄存器名称：";
		for (var key in register){
				dtm += key + " ";				
		}
		dtm += "\n";
		strreg = "";
		s = "0";
		for(var l = 0; l < tk - 1; l++){
				s += "_0";
		}		
		var reg = {};
		for (var key in func){
				var arr0 = key.split(" ");
				DTMMatchFunc(key,func[key]);
				var arr1 = curmov.split(" ");
				s1 = key.replace(/\s/g, "_");
				s2 = "";
				s0 = s;
				for(var k = 0; k < rc; k++){
						var ss0 = "";
						for(var i = 0; i < tk; i++){
								var ar = s0.split("_");
								var ar0 = alp[arr0[i + 1]].read.split(" ");
								if(ar0[k] == "#" || ar[i] == "#"){
										ar[i] = "#";
								}else{
										ar[i] = parseInt(ar[i]) * 2 + parseInt(ar0[k]);
								}
								ss0 += "_" + ar[i];
						}
						
						var str = "r_" + k + "_" + arr0[0] + "_" + s0;
						if(reg[str] == null){
								strreg += str + " ";
								reg[str] = 1;
						}
						s0 = ss0.substring(1, ss0.length);
						s2 += "w_" + k + "_" + s1 + " ";
						s2 += "m_" + k + "_" + s1 + " ";			
				}
				strreg += s2 + " ~~\n";
				var str = "r_0_" + arr1[0] + "_" + s;
				if(reg[str] == null){
						strreg += str +" ~~\n";;
						reg[str] = 1;
				}
		}
		strreg += "start   halt\n";
		dtm += strreg;
		
		dtm += "\n/////////字符表//////////\n";
		dtm += "//原字符表名称：";
		var s1 = "";
		for (var key in alphabet){
				s1 += key + " ";
		}
		stralp = "0 1 #\n";
		dtm += s1 + "\n";
		dtm += stralp;
		
		dtm += "\n/////////笛卡尔集//////////\n";		
		strdes = "";
		for(var k=0; k < tk; k++){
				strdes += "~n" + k + " 0 1 #\n";
		}
		dtm += strdes;

		dtm += "\n/////////映射函数集//////////\n";
		strmap = "";
		dtm += strmap;
		
		dtm += "\n/////////转移函数//////////\n";
		strreg = "";
		strfunc = "";
		s = "0";
		s1 = "";
		s2 = "";
		s3 = "";
		for(var l = 0; l < tk - 1; l++){
				s += "_0";
				s1 += "# ";
				s2 += "_0";
				s3 += "S ";
		}
		strfunc += "#start ~n0~ " + s1 + "r_0_start_0" + s2 + " ~n0~ " + s1 + "S " +s3 + "\n\n";
		
		var dtmrow = dtm.split("\n").length;
		dtmrow += 2;
		var fc = {};
		for (var key in func){
				var arr0 = key.split(" ");
				DTMMatchFunc(key,func[key]);
				var arr1 = curmov.split(" ");
				for(var i = tk + 1; i < 2 * tk + 1; i++){
						arr1[i] = arr1[i].toUpperCase();
				}
				s1 = key.replace(/\s/g, "_");
				s2 = arr1[0];
				for(var i = 1; i < tk + 1; i++){
						s2 += " " + arr1[i];
				}
				s2 = s2.replace(/\s/g, "_");
				s3 = "";
				s4 = "";
				s5 = "";
				s0 = s;
				for(var k = 0; k < rc; k++){
						var ss0 = "";
						var ss1 = "";
						var ss2 = "";
						var ss3 = "";
						var ss4 = "";
						var ms1 = "";
						var ms2 = "";
						var ms3 = "";
						
						for(var i = 0; i < tk; i++){
								var ar = s0.split("_");
								var ar0 = alp[arr0[i + 1]].read.split(" ");
								var ar1 = alp[arr0[i + 1]].write.split(" ");
								var ar2 = alp[arr1[i + 1]].read.split(" ");
								var ar3 = alp[arr1[i + 1]].write.split(" ");
								if(ar0[k] == "#" || ar[i] == "#"){
										ar[i] = "#";
								}else{
										ar[i] = parseInt(ar[i]) * 2 + parseInt(ar0[k]);
								}
								ss0 += "_" + ar[i];
								ss1 += ar0[k] + " ";
								ss2 += ar1[k] + " ";
								if(arr1[i + 1 + tk] == "R"){
										ss3 += ar2[k] + " "; 
								}else if(arr1[i + 1 + tk] == "L"){
										ss3 += "~n" + i + "~ "; 
								}else{
										ss3 += ar2[0] + " "; 
								}
								ss4 += ar3[k] + " "; 
								if(k == rc - 1){
										ms1 += "S ";
										ms2 += "S ";
								}else{
										ms1 += "R ";
										ms2 += "L ";
								}
								ms3 += arr1[i + 1 + tk] + " ";
						}
							
						if(k == rc - 1){	
								s3 += "#r_" + k + "_" + arr0[0] + "_" + s0 + " " + ss1 + "w_0_" + s1 + " " + ss1 + ms1 + "\n";
								s4 += "#w_" + k + "_" + s1 + " " + ss2 + "m_0_" + s1 + " " + ss4 + ms2 + "\n";
								if(arr1[0] != "halt"){
										s5 += "#m_" + k + "_" + s1 + " " + ss3 + "r_0_" + arr1[0] + "_" + s + " " + ss3 + ms3 + "\n";
								}else{
										s5 += "#m_" + k + "_" + s1 + " " + ss3 + "halt " + ss3 + ms3 + "\n";
								}
						}else{	
								var str = "r_" + k + "_" + arr0[0] + "_" + s0 + " " + ss1;
								if(fc[str] == null){
										fc[str] = dtmrow + k;
								}else{
										s3 += "//eq." + fc[str] + " ";
								}
								s3 += "#" + str + "r_" + (k + 1) + "_" + arr0[0] + ss0 + " " + ss1 + ms1 + "\n";
								s0 = ss0.substring(1, ss0.length);
								s4 += "#w_" + k + "_" + s1 + " " + ss2 + "w_" + (k + 1) + "_" + s1 + " " + ss4 + ms2 + "\n";
								s5 += "#m_" + k + "_" + s1 + " " + ss3 + "m_" + (k + 1) + "_" + s1 + " " + ss3 + ms3 + "\n";
						}		
				}
				strfunc += s3;
				strfunc += s4;
				strfunc += s5;
				strfunc += "\n";
				dtmrow += 3 * rc + 1;
		}
		dtm += strfunc;
		
		return dtm;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//函数名：DTMTanslate_OneTapeDTM
//参数：无
//返回值：新的图灵机描述
//调用模块：DTMMatchFunc
//全局变量：tape, register, alphabet, func, descartesset, map, row, curmov, curscr
//功能：将图灵机转换为单带图灵机
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DTMTanslate_OneTapeDTM()
{
		var dtm = "";
		for (var key in tape){
				if(key.indexOf("_") != -1){
						dtm += "//带名称中存在特殊符号 _ \n";
						break;
				}
		}
		for (var key in register){
				if(key.indexOf("_") != -1){
						dtm += "//寄存器名称中存在特殊符号 _ \n";
						break;
				}
		}
		for (var key in alphabet){
				if(key.indexOf("_") != -1){
						dtm += "//字符表名称中存在特殊符号 _ \n";
						break;
				}
		}
		if(dtm != "")return dtm;
		var s1, s2, s3, s4, s5, s6, s7;
		var strtape;	
		var strreg;
		var stralp;
		var strdes;
		var strmap;
		var strfunc;
		var tk = Object.keys(tape).length;//带长度	
		if(tk == 1){//字符表集合比01集合还少！
				for(var i = 0; i < row.length; i++){
						dtm += row[i] + "\n";
				}
				return dtm;
		}
		
		var da = new Array();
		dtm += "//图灵机描述\n";
		dtm += "/////////带名//////////\n";
		dtm += "//原带名称：";
		for (var key in tape){
				dtm += key + " ";
				da.push(2);
		}
		dtm += "\n";
		strtape = "input\n";
		dtm += strtape;
		
		dtm += "\n/////////寄存器//////////\n";
		dtm += "//原寄存器名称：";
		for (var key in register){
				dtm += key + " ";
		}
		dtm += "\n";
		strreg = "";
		s1 = "";
		s2 = "";
		for (var key in alphabet){
				s1 += "move_" + key + " ";
				s2 += "copy_" + key + " ";
		}
		strreg += s1 + " ~~\n";
		strreg += s2 + " ~~\n";
		s1 = "";
		s2 = "";
		for(var i = 0; i < tk - 1; i++){
				s1 += "fill" + i + " ";
				s2 += "rcmov" + i + " ";
		}
		s2 += "rcmov" + (tk - 1) + " ";
		strreg += s1 + " ~~\n";
		strreg += s2 + " ~~\n";
		strreg += "rmov0 rmov1 re se ~~\n";
		strreg += "start   halt  ~~\n";
		
		var reg = {};
		for (var key in func){
				var arr0 = key.split(" ");	
				DTMMatchFunc(key,func[key]);
				var arr1 = curmov.split(" ");	
				s4 = arr1[0];
				s5 = "";		
				for(var i = 0; i < tk; i++){
						traverseDescartesSet(da,freg);
						strreg += " ~~\n";
						s4 += "__";
						s5 += "1";
						function freg(c){
								s1 = "";
								s2 = arr0[0];
								s3 = arr0[0];
								for(var t = 0; t < c.length; t++){
										if(c[t] == 0){
												s1 += "0";
												s2 += "_" + arr0[t + 1];
										}else{
												s1 += "1";
												s2 += "__";
										}
										s3 += "_" + arr0[t + 1];

								}
								var rs = "r" + i + "_" + s1 + "_" + s2;
								if(reg[rs] == null){
										reg[rs] = 1;
										strreg += rs + " ";
								}
								var ws = "w" + i + "_" + s1 + "_" + s3;
								strreg += ws + " ";
								for(var k = 0; k < tk; k++){
										strreg += ws + "_L" + k + " ";
										strreg += ws + "_R" + k + " ";
										strreg += ws + "_m" + k + " ";
										strreg += ws + "_r" + k + " ";
								}
						}
				}
				var rs1 = "r0_" + s5 + "_" + s4;
				if(reg[rs1] == null){
						reg[rs1] = 1;
						strreg += rs1 + " ~~\n";
				}
		}
		dtm += strreg;
		
		dtm += "\n/////////字符表//////////\n";
		dtm += "//原字符表名称：";		
		stralp = "";
		s1 = "";
		s2 = "";
		s3 = "";
		for (var key in alphabet){
				s1 += " " + key + " ";
				s2 += "_" + key + " ";
				if(key != "#"){
						s3 += " " + key + " ";
				}
		}
		stralp += s1 + " ~~\n";
		stralp += s2 + " ~~\n_\n";
		dtm += s1 + "\n";
		dtm += stralp;
		
		dtm += "\n/////////笛卡尔集//////////\n";	
		strdes = "";
		strdes += "~A " + s1 + "\n";
		strdes += "~B " + s3 + "\n";
		strdes += "~C " + s1 + "\n";
		strdes += "~D" + s1 + " ~~\n    " + s2 + "\n";
		dtm += strdes;

		dtm += "\n/////////映射函数集//////////\n";
		strmap = "";
		dtm += strmap;	
		
		dtm += "\n/////////转移函数//////////\n";
		strfunc = "";
		//初始化输入
		strfunc += "#start ~A~ move_~A~ _~A~ R\n";
		strfunc += "#move_~A~ ~B~ move_~A~ ~B~ R\n";
		strfunc += "#move_~A~ _ copy_~A~ _ R\n";
		strfunc += "#move_~A~ # copy_~A~ _ R\n";
		strfunc += "#copy_~A~ _~C~ copy_~A~ _~C~ R\n";
		strfunc += "#copy_~A~ # fill0 _~A~ R\n";
		for(var i = 0; i < tk - 1; i++){
				if(i == tk - 2){
						strfunc += "#fill" + i + " # rmov0 _# S\n";
				}else{
						strfunc += "#fill" + i + " # fill" + (i + 1) + " _# R\n";
				}
		}
		strfunc += "#rmov0 _~A~ rmov0 _~A~ L\n";
		strfunc += "#rmov0 _ rmov1 _ L\n";
		strfunc += "#rmov1 ~A~ rmov1 ~A~ L\n";
		strfunc += "#rmov1 _~A~ start ~A~ R\n";
		strfunc += "#start _ rcmov0 _ R\n";
		s1 = "";
		s2 = "";
		for(var i = 0; i < tk; i++){
				if(i == tk - 1){
						strfunc += "#rcmov" + i + " _~A~ re _~A~ R\n";
				}else{
						strfunc += "#rcmov" + i + " _~A~ rcmov" + (i + 1) + " _~A~ R\n";
				}
				s1 += "__";
				s2 += "1";
		}
		strfunc += "#re _~A~ re ~A~ R\n";
		strfunc += "#re # se # S\n";
		strfunc += "#se ~D~ se ~D~ L\n";
		strfunc += "#se _ r0_" + s2 + "_start" + s1 + " _ R\n";
		strfunc += "\n";
		dtm += strfunc;
		var dtmrow = dtm.split("\n").length;
		strfunc = "";
		var ff = {};
		for (var key in func){
				var arr0 = key.split(" ");
				DTMMatchFunc(key,func[key]);
				var arr1 = curmov.split(" ");		
				for(var i = tk + 1; i < 2 * tk + 1; i++){
						arr1[i] = arr1[i].toUpperCase();
				}		
				for(var i = 0; i < tk; i++){
						var bb = 0;
						traverseDescartesSet(da,fc);
						strfunc += "\n";
						dtmrow++;
						function fc(c){
								s1 = "";
								s2 = arr0[0];
								s3 = "";
								s4 = arr1[0];
								s5 = "";
								s6 = arr0[0];
								s7 = arr0[0];
								for(var t = 0; t < c.length; t++){
										if(c[t] == 0){
												s1 += "0";
												s2 += "_" + arr0[t + 1];
										}else{
												s1 += "1";
												s2 += "__";
										}
										s3 += "1";
										s4 += "__";
										if(c[t] == 0 || t == i){
												s5 += "0";
												s6 += "_" + arr0[t + 1];
										}else{
												s5 += "1";
												s6 += "__";
										}
										s7 += "_" + arr0[t + 1];
								}
								var rs = "r" + i + "_" + s1 + "_" + s2;
								var ws1 = "w" + i + "_" + s1 + "_" + s7;
								var ws2 = "w" + (i + tk - 1)%tk + "_" + s1 + "_" + s7;
								var ws3 = "w" + (i + tk - 1)%tk + "_" + s5 + "_" + s7;
								if(bb == 1){
										if(ff[rs + " ~A~"] == null){
												ff[rs + " ~A~"] = dtmrow;
										}else{
												strfunc += "//eq. " + ff[rs + " ~A~"] + " ";
										}
										strfunc += "#" + rs + " ~A~ r" + (i + 1)%tk + "_" + s1 + "_" + s2 + " ~A~ R\n";
										dtmrow++;
										if(c[i] == 1){
												if(ff[rs + " _" + arr0[i + 1]] == null){
														ff[rs + " _" + arr0[i + 1]] = dtmrow;
												}else{
														strfunc += "//eq. " + ff[rs + " _" + arr0[i + 1]] + " ";
												}
												strfunc += "#" + rs + " _" + arr0[i + 1] + " r" + (i + 1)%tk + "_" + s5 + "_" + s6 + " _" + arr0[i + 1] + " R\n";
												dtmrow++;
										}
								}else{
										strfunc += "#" + rs + " ~A~ w" + (i + tk - 1)%tk + "_" + s3 + "_" + s7 + " ~A~ L\n";
										dtmrow++;
								}
								if(bb == 1){
										strfunc += "#" + ws1 + " ~A~ " + ws2 + " ~A~ L\n";
										dtmrow++;
										if(c[i] == 1){
												if(arr1[i + tk + 1] == "S"){
														strfunc += "#" + ws1 + " _" + arr0[i + 1] + " " + ws3 + " _" + arr1[i + 1] + " L\n";
														dtmrow++;
												}else{
														var ss1, ss2;
														if(arr1[i + tk + 1] == "L"){
																ss1 = "L";
																ss2 = "R";
														}else{
																ss1 = "R";
																ss2 = "L";
														}
														strfunc += "#" + ws1 + " _" + arr0[i + 1] + " " + ws3 + "_" + ss1 + "0 " + arr1[i + 1] + " " + ss1 + "\n";
														for(var k = 0; k < tk - 1; k++){
																strfunc += "#" + ws3 + "_" + ss1 + k + " ~D~ " + ws3 + "_" + ss1 + (k + 1) + " ~D~ " + ss1 + "\n";
														}
														strfunc += "#" + ws3 + "_" + ss1 + (tk - 1) + " ~A~ " + ws3 + "_" + ss2 + "0 _~A~ " + ss2 + "\n";
														for(var k = 0; k < tk - 1; k++){
																strfunc += "#" + ws3 + "_" + ss2 + k + " ~D~ " + ws3 + "_" + ss2 + (k + 1) + " ~D~ " + ss2 + "\n";
														}
														strfunc += "#" + ws3 + "_" + ss2 + (tk - 1) + " " + arr1[i + 1] + " " + ws3 + " " + arr1[i + 1] + " L\n";
														dtmrow += 2 * tk + 1;
														if(ss1 == "L"){//带的左边扩充（单边图灵机不需要）
																strfunc += "#" + ws3 + "_" + ss1 + i + " _ " + ws3 + "_m0 # L\n";
																for(var k = 0; k < tk - 1; k++){
																		strfunc += "#" + ws3 + "_m" + k + " ~A~ " + ws3 + "_m" + (k + 1) + " # L\n";
																}
																strfunc += "#" + ws3 + "_m" + (tk - 1) + " ~A~ " + ws3 + "_r0 _ R\n";
																for(var k = 0; k < tk - 1; k++){
																		strfunc += "#" + ws3 + "_r" + k + " # " + ws3 + "_r" + (k + 1) + " # R\n";
																}
																strfunc += "#" + ws3 + "_r" + (tk - 1) + " # " + ws3 + "_" + ss1 + i +" # S\n";
																dtmrow += 2* tk + 1;
														}
												}
										}else{
												strfunc += "#" + ws1 + " _~A~ " + ws2 + " _~A~ L\n";
												dtmrow++;
										}
								}else{
										strfunc += "#" + ws1 + " ~D~ " + ws2 + " ~D~ L\n";
										dtmrow++;
										if(i == tk - 1){
												if(arr1[0] == "halt"){
														strfunc += "#" + ws1 + " _ halt _ R\n";
												}else{
														strfunc += "#" + ws1 + " _ r0_" + s3 + "_" + s4 + " _ R\n";
												}
												dtmrow++;
										}
								}
								bb = 1;
						}
				}
		}
		dtm += strfunc;
		return dtm;
}